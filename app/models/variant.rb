class Variant < ActiveRecord::Base
  include Authority::Abilities

  BOARD_TYPES = %w( square hexagonal )
  SUPPORT_TYPES = %w( none binary sum )

  ########################################
  # Relations
  ########################################

  has_many :games, dependent: :destroy
  has_many :piece_rules, dependent: :destroy
  has_many :terrain_rules, dependent: :destroy
  has_many :ratings, dependent: :destroy
  has_many :topics, as: :parent, dependent: :destroy
  belongs_to :user

  ########################################
  # Validations
  ########################################

  validates :board_columns, presence: true, numericality: { only_integer: true, greater_than: 1 }, :if => :square_board?
  validates :board_rows, presence: true, numericality: { only_integer: true, greater_than: 1 }, :if => :square_board?
  validates :board_size, presence: true, numericality: { only_integer: true, greater_than: 1 }, :if => :hexagonal_board?
  validates :board_type, presence: true, inclusion: { in: BOARD_TYPES }
  validates :piece_ranks, inclusion: { in: [true, false] }
  validates :support_type, presence: true, inclusion: { in: SUPPORT_TYPES }, :if => :piece_ranks?
  validates :user_id, presence: true, uniqueness: true

  ########################################
  # Callbacks
  ########################################

  after_create :add_initial_king

  ########################################
  # Instance Methods
  ########################################

  BOARD_TYPES.each do |b|
    define_method(:"#{b}_board?") { self.board_type == b }
  end

  def available_piece_types
    PieceType.where.not(id: piece_rules.pluck(:piece_type_id))
  end

  def available_terrain_types
    TerrainType.where.not(id: terrain_rules.pluck(:terrain_type_id))
  end

  def average_rating
    ratings.average('value') || 0
  end

  def review_topic
    topics.find_or_create_by(title: 'Reviews')
  end

  def allows_support?
    piece_ranks && support_type != 'none'
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
      out[:valid_plies] = { type: opts[:type], valid: g.valid_plies(p, p.coordinate, opts[:type]), reachable: [] }
    end

    out
  end

  private

  def add_initial_king
    piece_rules.create!(
      capture_type: 'movement',
      count: 1,
      attack_rank: 1,
      defense_rank: 1,
      movement_minimum: 1,
      movement_maximum: 1,
      movement_type: 'orthogonal_line',
      piece_type: PieceType.find_by(name: 'King'),
    )
  end

end