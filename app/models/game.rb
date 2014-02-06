class Game < ActiveRecord::Base
  include Authority::Abilities

  ########################################
  # Class Methods
  ########################################

  def self.actions
    %w( setup move complete )
  end

  def self.sides
    %w( alabaster onyx )
  end

  scope :current, -> { where.not(action: 'complete') }
  scope :for_user, -> (user) { where('alabaster_id = ? OR onyx_id = ?', user.id, user.id) }

  ########################################
  # Relations
  ########################################

  belongs_to :action_to, class_name: 'User'
  belongs_to :alabaster, class_name: 'User'
  belongs_to :onyx, class_name: 'User'
  belongs_to :variant

  has_many :pieces, dependent: :destroy
  has_many :terrains, dependent: :destroy

  ########################################
  # Validations
  ########################################

  validates :action, inclusion: { in: self.actions }
  validates :alabaster, presence: true
  validates :onyx, presence: true
  validates :variant, presence: true

  ########################################
  # Instance Methods
  ########################################

  def board
    @board ||= "#{variant.board_type.camelize}Board".constantize.new(variant)
  end

  def color(user_id)
    if user_id == alabaster_id
      'alabaster'
    else
      'onyx'
    end
  end

  def opponent_id(user_id)
    if user_id == alabaster_id
      onyx_id
    else
      alabaster_id
    end
  end

  # Adds a piece/terrain
  #   type must be "piece" or "terrain"
  def setup_add(user, type, type_id, coordinate)
    setup_remove(user, type, coordinate)
    send(type.pluralize).create( { coordinate: coordinate, "#{type}_type_id" => type_id, user_id: user.id } )
  end

  # Moves a piece/terrain
  #   type must be "piece" or "terrain"
  def setup_move(user, type, from, to)
    setup_remove(user, type, to)
    object = self.send(type.pluralize).where(user_id: user.id).for_coordinate(from).first
    object.update_attributes(coordinate: to) if object
  end

  # Removes a piece/terrain
  #   type must be "piece" or "terrain"
  def setup_remove(user, type, coordinate)
    send(type.pluralize).where(user_id: user.id).for_coordinate(coordinate).destroy_all
  end

  def setup_errors(user)
    user_pieces = pieces.where(user_id: user.id)
    user_terrains = terrains.where(user_id: user.id)
    errors = []

    if user_pieces.count != variant.number_of_pieces
      errors << "Please place #{variant.number_of_pieces} pieces. You placed #{pieces.count}."
    end

    variant.piece_rules.each do |pr|
      placed = user_pieces.where(piece_type_id: pr.piece_type_id).count
      if placed < pr.count_minimum || placed > pr.count_maximum
        errors << "Please place #{pr.count_with_name}. You placed #{placed}."
      end
    end

    variant.terrain_rules.each do |tr|
      placed = user_terrains.where(terrain_type_id: tr.terrain_type_id).count
      if placed != tr.count
        errors << "Please place #{tr.count_with_name}. You placed #{placed}."
      end
    end

    errors
  end

  def setup_complete(user)
    if action_to_id == nil
      self.action_to_id = opponent_id(user.id)
    else
      self.action = 'move'
      self.action_to_id = alabaster_id
    end

    self.save
  end

  def move_piece(piece, to, range_capture = nil)
    pieces.for_coordinate(to).destroy_all
    pieces.for_coordinate(range_capture).destroy_all
    piece.update_attributes(coordinate: to)

    opponent_id = opponent_id(action_to_id)
    if pieces.joins(:piece_type).where(user_id: opponent_id, piece_types: {name: 'King'}).count == 0
      update_attributes(action: 'complete')
    else
      update_attributes(action_to_id: opponent_id)
    end
  end

  def resign(user)
    update_attributes(action: 'complete', action_to_id: opponent_id(user.id))
  end

  def ply_valid?(piece, to, range_capture = nil)
    return false unless valid_plies(piece, piece.coordinate, 'movement').include?(to)

    if piece.rule.range_capture? && range_capture.present?
      valid_plies(piece, to, 'range').include?(range_capture)
    else
      true
    end
  end

  # Returns the array of valid plies for a piece
  def valid_plies(piece, from, type = 'movement')
    ply_data = PlyData.new(piece, board, type)

    if ply_data.line?
      line_plies(ply_data, from)
    else
      turn_plies(ply_data, from)
    end
  end

  private

  # Returns all plies for movement in a line
  def line_plies(ply_data, from)
    plies = []

    ply_data.directional_functions.each do |directional_function|
      to = from.clone
      movement_count = 0

      while !(ply_data.maximum && movement_count == ply_data.maximum)
        directional_function.call(to)
        to = board.reduce_coordinate(to)
        movement_count += 1

        continue, valid = evaluate_ply(ply_data, to, movement_count)
        plies << to.clone if valid
        break unless continue
      end
    end

    plies
  end

  # Returns all plies for movement with turns
  def turn_plies(ply_data, from)
    _turn_plies(ply_data, from, 0)
  end

  # Recursive function for turn_plies
  #
  # piece = piece that is moving
  # from = where the piece is moving from this deep in the search
  # movement_count = number of spaces moved from piece.coordinate to from
  def _turn_plies(ply_data, from, movement_count)
    return [] if ply_data.maximum && movement_count == ply_data.maximum

    plies = []

    ply_data.directional_functions.each do |directional_function|
      to = from.clone
      directional_function.call(to)
      to = board.reduce_coordinate(to)

      # Stop if distance did not grow
      next if board.distance(ply_data.coordinate, from) >= board.distance(ply_data.coordinate, to)

      continue, valid = evaluate_ply(ply_data, to, movement_count + 1)
      plies << to.clone if valid
      next unless continue

      # Continue
      plies += _turn_plies(ply_data, to, movement_count + 1)
    end

    plies.uniq
  end

  # Shared ply evaluation between line_plies and turn_plies
  #
  # Returns [stop, valid]
  def evaluate_ply(ply_data, to, movement_count)
    # Stop if off the board
    return [false, false] if board.coordinate_invalid?(to)

    # Get piece at square (ignore self)
    occupying_piece = pieces.for_coordinate(to).first unless to == ply_data.coordinate

    if occupying_piece
      # Stop if ran into own piece
      if occupying_piece.user == ply_data.user
        return [false, false]
      # Stop if ran into enemy piece and cannot capture
      elsif !ply_data.capture
        return [false, false]
      end
    end

    occupying_terrain = terrains.for_coordinate(to).first

    if occupying_terrain
      # Stop if ran into blocking terrain
      if occupying_terrain.rule.public_send "block_#{ply_data.type}"
        return [false, false]
      end
    end

    continue = occupying_piece.blank?
    valid = movement_count >= ply_data.minimum

    [continue, valid]
  end

end