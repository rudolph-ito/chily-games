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
    name = terrain_type.name.downcase
    name = name.pluralize if count != 1
    "#{count} #{name}"
  end

  def block_movement
    block_message('movement')
  end

  def block_range
    block_message('range')
  end

  def block?(type, piece_type_id)
    ids = public_send("block_#{type}_piece_type_ids")
    value = public_send("block_#{type}_type")

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
    ids = public_send("block_#{type}_piece_type_ids")
    value = public_send("block_#{type}_type")

    if value == 'none'
      'No'
    elsif value == 'all'
      'All pieces'
    else
      names = ids.map{ |pid| PieceType.find(pid).name }
      if value == 'include'
        'Only '
      else
        'All pieces except '
      end + names.to_sentence
    end
  end

  # Options
  # destructible
  # protecttion

end