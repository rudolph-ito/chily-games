class PieceRule < ActiveRecord::Base
  include Authority::Abilities

  ########################################
  # Class Methods
  ########################################

  def self.movement_types
    %w( orthogonal_line diagonal_line orthogonal_or_diagonal_line orthogonal_with_turns diagonal_with_turns )
  end

  ########################################
  # Relations
  ########################################

  belongs_to :piece_type
  belongs_to :variant

  ########################################
  # Validations
  ########################################

  validates :count_minimum, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :count_maximum, numericality: { only_integer: true, greater_than_or_equal_to: lambda { |r| r.count_minimum || 0 } }, unless: lambda { |r| r.count_maximum.blank? }
  validates :movement_type, presence: true, inclusion: { in: self.movement_types }
  validates :movement_minimum, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :movement_maximum, numericality: { only_integer: true, greater_than_or_equal_to: lambda { |r| r.movement_minimum || 1 } }, unless: lambda { |r| r.movement_maximum.blank? }
  validates :piece_type, presence: true
  validates :variant, presence: true

  validate :validate_king_count, if: lambda { |r| r.piece_type.try(:king?) }

  ########################################
  # Instance Methods
  ########################################

  def count
    count_minimum.to_s + if count_maximum.blank?
      ' or more'
    elsif count_minimum < count_maximum
      ' to ' + count_maximum.to_s
    else
      ''
    end
  end

  def movement
    limit = movement_minimum.to_s + if movement_maximum.blank?
      ' or more'
    elsif movement_minimum < movement_maximum
      ' to ' + movement_maximum.to_s
    else
      ''
    end

    "#{movement_type.humanize} - #{limit} space(s)"
  end

  private

  def validate_king_count
    unless count_minimum == 1 && count_maximum == 1
      errors.add(:count_minimum, 'There must be exactly one King.')
    end
  end

  # Options
  # move - whether or not piece can move
  # move_through - whether or not this piece can move through occupied squares
  # move_capture - whether or not this piece can move into enemy spaces, and capture the enemy
  # move_capturable - pieces that can be move captured
  # move_type - method of determining what spaces are within range
  # move_limit - lower and upper bound for the number of spaces that can be moved
  # range_capture - whether of not this piece can attack enemies from range
  # range_capturable - names of pieces this piece can range capture
  # range_type - method of determining what spaces are within range
  # range_limit - lower and upper bound for the number of spaces that are within range
  # move_and_range_capture - whether or not the piece can move and capture on the same turn (possible gamewide rule)
end