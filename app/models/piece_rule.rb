class PieceRule < ActiveRecord::Base
  include Authority::Abilities

  DIRECTIONS = %w( orthogonal_line diagonal_line orthogonal_or_diagonal_line orthogonal_with_turns diagonal_with_turns )
  CAPTURE_TYPES = %w( movement range )

  default_scope { order('piece_type_id asc') }

  ########################################
  # Relations
  ########################################

  belongs_to :piece_type
  belongs_to :variant

  ########################################
  # Validations
  ########################################

  validates :piece_type, presence: true
  validates :variant, presence: true

  validate :validate_king_count, if: lambda { |r| r.piece_type.try(:king?) }

  # Count
  validates :count, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }

  # Movement
  validates :movement_minimum, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :movement_maximum, numericality: { only_integer: true, greater_than_or_equal_to: lambda { |r| r.movement_minimum || 1 } }, unless: lambda { |r| r.movement_maximum.blank? }
  validates :movement_type, presence: true, inclusion: { in: DIRECTIONS }

  # Capture
  validates :capture_type, presence: true, inclusion: { in: CAPTURE_TYPES }

  # Rank
  validates :attack_rank, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }, if: lambda { |r| r.variant.try(:piece_ranks?) }
  validates :defense_rank, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }, if: lambda { |r| r.variant.try(:piece_ranks?) }

  # Range
  validates :range_minimum, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }, if: :range_capture?
  validates :range_maximum, numericality: { only_integer: true, greater_than_or_equal_to: lambda { |r| r.range_minimum || 1 } }, if: :range_capture?, unless: lambda { |r| r.range_maximum.blank? }
  validates :range_type, presence: true, inclusion: { in: DIRECTIONS }, if: :range_capture?

  ########################################
  # Instance Methods
  ########################################

  def range_capture?
    capture_type == 'range'
  end

  private

  def validate_king_count
    unless count == 1
      errors.add(:count_minimum, 'There must be exactly one King.')
    end
  end
end