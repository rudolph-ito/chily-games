class Game < ActiveRecord::Base
  include Authority::Abilities

  ########################################
  # Class Methods
  ########################################

  def self.actions
    %w( setup move attack complete )
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

  has_many :pieces
  has_many :terrains

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

  def oppponent_id(user_id)
    if user_id == alabaster_id
      onyx_id
    else
      alabaster_id
    end
  end

  def setup_add_piece(user, piece_type_id, coordinate)
    setup_remove_piece(user, coordinate)
    pieces.create!(coordinate: coordinate, piece_type_id: piece_type_id, user_id: user.id)
  end

  def setup_move_piece(user, from, to)
    setup_remove_piece(user, to)
    piece = pieces.where(user_id: user.id).for_coordinate(from).first
    piece.update_attributes(coordinate: to) if piece
  end

  def setup_remove_piece(user, coordinate)
    pieces.where(user_id: user.id).for_coordinate(coordinate).destroy_all
  end

  def setup_errors(user)
    user_pieces = pieces.where(user_id: user.id)
    errors = []

    if user_pieces.count != variant.number_of_pieces
      errors << "Please place #{variant.number_of_pieces} pieces. You placed #{pieces.count}."
    end

    variant.piece_rules.each do |pr|
      placed = user_pieces.where(piece_type_id: pr.piece_type_id).count
      if placed < pr.count_minimum || placed > pr.count_maximum
        name = pr.piece_type.name.downcase
        name = name.pluralize if pr.count_minimum != pr.count_maximum && pr.count_maximum  != 1
        errors << "Please place #{pr.count} #{name}. You placed #{placed}."
      end
    end

    errors
  end

  def setup_complete(user)
    if action_to_id == nil
      self.action_to_id = oppponent_id(user.id)
    else
      self.action = 'move'
      self.action_to_id = alabaster_id
    end

    self.save
  end

  def move_piece(from, to)
    pieces.for_coordinate(to).destroy_all
    piece = pieces.for_coordinate(from).first
    piece.update_attributes(coordinate: to) if piece
  end

  # # Ply: a hash with the following keys
  # #
  # # piece =>
  # # to =>

  # Returns false if invalid
  # Returns the valid ply (ply + more information) if valid
  def ply_valid?(from, to)
    piece = pieces.for_coordinate(from).first
    return false unless piece

    valid_plies(piece).each do |valid_ply|
      return true if to == valid_ply['to']
    end

    return false
  end

  # Returns the array of valid plies for a piece
  #
  # Each valid ply is a hash
  #  "to" => <coordinate>
  #  "capture" => <piece that is captured>
  def valid_plies(piece)
    rule = variant.piece_rules.find_by(piece_type_id: piece.piece_type.id)

    # Get movement_functions
    movement_functions = []
    movement_functions += board.movement_function('orthogonal') if rule.movement_type.include?('orthogonal')
    movement_functions += board.movement_function('diagonal') if rule.movement_type.include?('diagonal')

    if rule.movement_type.end_with?('line')
      line_plies(piece, rule, movement_functions)
    elsif rule.movement_type.end_with?('with_turns')
      turn_plies(piece, rule, movement_functions)
    end
  end

  private

  # Returns all plies for movement in a line
  #
  # piece = piece that is moving
  # rule = rule used to calulate movements
  # movement_functions = calculated from rule.movement_type and variant.board_type, precomputed for effeciency
  def line_plies(piece, rule, movement_functions)
    plies = []

    movement_functions.each do |movement_function|
      to = piece.coordinate.clone
      movement_count = 0

      while !(rule.movement_maximum && movement_count == rule.movement_maximum)
        movement_function.call(to)
        to = board.reduce_coordinate(to)
        movement_count += 1

        stop, ply = evaluate_ply(piece, rule, to, movement_count)
        plies << ply if ply
        break if stop
      end
    end

    plies
  end

  # Returns all plies for movement with turns
  #
  # piece = piece that is moving
  # rule = rule used to calulate movements
  # movement_functions = calculated from rule.movement_type and variant.board_type, precomputed for effeciency
  def turn_plies(piece, rule, movement_functions)
    _turn_plies(piece, rule, movement_functions, piece.coordinate, 0)
  end

  # Recursive function for turn_plies
  #
  # piece = piece that is moving
  # rule = rule used to calulate movements
  # movement_functions = calculated from rule.movement_type and variant.board_type, precomputed for effeciency
  # from = where the piece is moving from this deep in the search
  # movement_count = number of spaces moved from piece.coordinate to from
  def _turn_plies(piece, rule, movement_functions, from, movement_count)
    return [] if rule.movement_maximum && movement_count == rule.movement_maximum

    plies = []

    movement_functions.each do |movement_function|
      to = from.clone
      movement_function.call(to)
      to = board.reduce_coordinate(to)

      # Stop if distance did not grow
      next if board.distance(piece.coordinate, from) >= board.distance(piece.coordinate, to)

      stop, ply = evaluate_ply(piece, rule, to, movement_count + 1)
      plies << ply if ply
      next if stop

      # Continue
      plies += _turn_plies(piece, rule, movement_functions, to, movement_count + 1)
    end

    plies
  end

  # Shared ply evaluation between line_plies and turn_plies
  #
  # Returns [stop, ply]
  def evaluate_ply(piece, rule, to, movement_count)
    ply = nil

    # Stop if off the board
    return true if board.coordinate_invalid?(to)

    # Get piece at square
    occupied_by = pieces.detect{ |p| p.coordinate == to }

    # Stop if ran into own piece
    return true if occupied_by && occupied_by.user == piece.user

    # Create ply (unless not above minimum)
    unless movement_count < rule.movement_minimum
      ply = { 'to' => to.clone, 'capture' => occupied_by }
    end

    return [occupied_by, ply]
  end

end