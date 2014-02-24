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
    @board ||= BoardFactory.instance(variant)
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

    variant.piece_rules.each do |pr|
      placed = user_pieces.where(piece_type_id: pr.piece_type_id).count
      if placed != pr.count
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
    return false unless ply_calculator.valid_plies(piece, piece.coordinate, 'movement').include?(to)

    if piece.rule.range_capture? && range_capture.present?
      ply_calculator.valid_plies(piece, to, 'range').include?(range_capture)
    else
      true
    end
  end

  def valid_plies(piece, from, type)
    ply_calculator.valid_plies(piece, from, type)
  end

  def valid_plies_for_user(user, piece, from, type)
    ply_calculator(user).valid_plies(piece, from, type)
  end

  def ply_calculator(user = nil)
    @ply_calculator ||= PlyCalculatorFactory.instance(self, user)
  end

end