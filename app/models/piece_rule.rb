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
  validates :rank, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }, if: lambda { |r| r.variant.try(:piece_ranks?) }

  # Range
  validates :range_minimum, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }, if: :range_capture?
  validates :range_maximum, numericality: { only_integer: true, greater_than_or_equal_to: lambda { |r| r.range_minimum || 1 } }, if: :range_capture?, unless: lambda { |r| r.range_maximum.blank? }
  validates :range_type, presence: true, inclusion: { in: DIRECTIONS }, if: :range_capture?

  ########################################
  # Instance Methods
  ########################################

  def count_with_name
    Messages.count_with_name(count, piece_type.name.downcase)
  end

  def range_capture?
    capture_type == 'range'
  end

  def can_capture?(type, enemy_rank)
    type == capture_type && (!variant.piece_ranks? || enemy_rank <= rank)
  end

  # Descriptions

  def movement_description
    'movement: ' + Messages.type_with_range(self, 'movement')
  end

  def capture_description
    'capture ' + if range_capture?
      'by range: ' + Messages.type_with_range(self, 'range')
    else
      'by movement'
    end
  end

  def range_capture_restriction
    prefix = if move_and_range_capture? then 'can' else 'cannot' end
    prefix + ' move and capture on the same turn'
  end

  private

  def validate_king_count
    unless count == 1
      errors.add(:count_minimum, 'There must be exactly one King.')
    end
  end

  # Options
  # movment_through - whether or not this piece can move through occupied squares
  # range_through - whether or not this piece can range through occupied squares
  # movment_capturable - pieces that can be move captured
  # range_capturable - pieces that can be range captured
end