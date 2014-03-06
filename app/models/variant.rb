class Variant < ActiveRecord::Base
  include Authority::Abilities
  include VariantMessages

  ########################################
  # Class Methods
  ########################################

  def self.board_types
    %w( square hexagonal )
  end

  def self.preview(opts = {})
  end

  ########################################
  # Relations
  ########################################

  has_many :games
  has_many :piece_rules, dependent: :destroy
  has_many :terrain_rules, dependent: :destroy
  belongs_to :user

  ########################################
  # Validations
  ########################################

  validates :board_columns, presence: true, numericality: { only_integer: true, greater_than: 1 }, :if => :square_board?
  validates :board_rows, presence: true, numericality: { only_integer: true, greater_than: 1 }, :if => :square_board?
  validates :board_size, presence: true, numericality: { only_integer: true, greater_than: 1 }, :if => :hexagonal_board?
  validates :board_type, presence: true, inclusion: { in: self.board_types }
  validates :user_id, presence: true, uniqueness: true

  ########################################
  # Callbacks
  ########################################

  after_create :add_initial_king

  ########################################
  # Instance Methods
  ########################################

  def name
    "Cyvasse by #{user.username}"
  end

  self.board_types.each do |b|
    define_method(:"#{b}_board?") { self.board_type == b }
  end

  def board
    if square_board?
      "Square Board (#{board_rows}x#{board_columns})"
    elsif hexagonal_board?
      "Hexagonal Board (size #{board_size})"
    end
  end

  def board_info
    out = {board_type: board_type}
    if square_board?
      out.merge!(board_columns: board_columns, board_rows: board_rows)
    elsif hexagonal_board?
      out.merge!(board_size: board_size)
    end
    out
  end

  def preview(opts)
    out = {options: board_info, color: 'onyx'}

    if opts[:piece_type_id]
      g = Game.new(variant: self)
      p = Piece.new(g, {coordinate: g.board.center_coordinate, type_id: opts[:piece_type_id]})
      out[:pieces] = [ { coordinate: p.coordinate, piece_type_id: p.type_id, color: 'onyx' } ]
      out[:valid_plies] = { type: opts[:type], coordinates: g.valid_plies(p, p.coordinate, opts[:type]) }
    end

    out
  end

  private

  def add_initial_king
    piece_rules.create!(
      capture_type: 'movement',
      count: 1,
      movement_minimum: 1,
      movement_maximum: 1,
      movement_type: 'orthogonal_line',
      piece_type: PieceType.find_by(name: 'King'),
    )
  end

end