class Game < ActiveRecord::Base
  include Authority::Abilities

  ########################################
  # Class Methods
  ########################################

  def self.actions
    %w( setup play complete )
  end

  def self.sides
    %w( alabaster onyx )
  end

  scope :current, -> { where.not(action: 'complete') }
  scope :for_user, -> (user) { where('alabaster_id = ? OR onyx_id = ?', user.id, user.id) }

  ########################################
  # Relations
  ########################################

  serialize :initial_setup_json, JSON
  serialize :current_setup_json, JSON
  serialize :plies_json, JSON

  belongs_to :action_to, class_name: 'User'
  belongs_to :alabaster, class_name: 'User'
  belongs_to :onyx, class_name: 'User'
  belongs_to :variant

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

  def setup_for_user(user)
    if user && action == 'setup'
      initial_setup.for_user_id(user.id)
    else
      current_setup
    end
  end

  def initial_setup
    CoordinateMap.new(self, :initial_setup_json)
  end

  def current_setup
    CoordinateMap.new(self, :current_setup_json)
  end

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

  def next_action_to_id
    if action_to_id == alabaster_id
      onyx_id
    else
      alabaster_id
    end
  end

  def get_piece(user, coordinate)
    setup_for_user(user).get(coordinate, Piece)
  end

  def complete?
    pieces = current_setup.for_class(Piece)
    pieces.detect{ |p| p.user_id == next_action_to_id && p.piece_type.name == 'King' }.nil?
  end

  def setup_complete(user)
    if action_to_id == nil
      self.action_to_id = opponent_id(user.id)
    else
      self.action = 'play'
      self.action_to_id = alabaster_id
      self.current_setup_json = self.initial_setup_json
    end

    self.save
  end

  def resign(user)
    update_attributes(action: 'complete', action_to_id: opponent_id(user.id))
  end

  def valid_plies(piece, from, type)
    ply_calculator.valid_plies(piece, from, type)
  end

  def valid_plies_for_user(user, piece, from, type)
    ply_calculator(user).valid_plies(piece, from, type)
  end

  def ply_calculator(user = nil)
    PlyCalculator.new(board, setup_for_user(user))
  end

end