class TerrainRule < ActiveRecord::Base
  include Authority::Abilities

  BLOCK_TYPES = %w(none all include exclude)

  ########################################
  # Relations
  ########################################

  belongs_to :terrain_type
  belongs_to :variant

  serialize :block_movement_piece_type_ids, JSON
  serialize :block_range_piece_type_ids, JSON

  ########################################
  # Validations
  ########################################

  validates :terrain_type, presence: true
  validates :variant, presence: true

  # Count
  validates :count, presence: true, numericality: { only_integer: true, greater_than: 0 }

  # Block
  validates :block_movement_type, inclusion: { in: BLOCK_TYPES }
  validates :block_range_type, inclusion: { in: BLOCK_TYPES }

  ########################################
  # Callbacks
  ########################################

  before_save :clean_piece_type_ids

  def clean_piece_type_ids
    self.block_movement_piece_type_ids ||= []
    self.block_range_piece_type_ids ||= []

    self.block_movement_piece_type_ids.reject!{ |x| x.blank? }
    self.block_range_piece_type_ids.reject!{ |x| x.blank? }
  end

  ########################################
  # Instance Methods
  ########################################

  def count_with_name
    Messages.count_with_name(count, terrain_type.name.downcase)
  end

  def rule_descriptions
    [block_movement_description, block_range_description].compact
  end

  def block_movement_description
    block_message('movement')
  end

  def block_range_description
    block_message('range')
  end

  def block?(type, piece_type_id)
    ids = public_send("block_#{type}_piece_type_ids")
    value = public_send("block_#{type}_type")
    piece_type_id = piece_type_id.to_s

    case value
    when 'none'
      false
    when 'all'
      true
    when 'include'
      ids.include?(piece_type_id)
    when 'exclude'
      !ids.include?(piece_type_id)
    end
  end

  private

  def block_message(type)
    value = Messages.include_exclude(self, "block_#{type}")
    "blocks #{type} for #{value}" if value
  end

end