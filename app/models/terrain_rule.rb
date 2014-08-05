class TerrainRule < ActiveRecord::Base
  include Authority::Abilities

  EFFECT_TYPES = %w(none all include exclude)
  BOOLEAN_TYPES = [true, false]

  default_scope { order('terrain_type_id asc') }

  ########################################
  # Relations
  ########################################

  belongs_to :terrain_type
  belongs_to :variant

  serialize :passable_movement_effect_piece_type_ids, JSON
  serialize :passable_range_effect_piece_type_ids, JSON
  serialize :slows_movement_effect_piece_type_ids, JSON
  serialize :stops_movement_effect_piece_type_ids, JSON

  ########################################
  # Validations
  ########################################

  validates :terrain_type, presence: true
  validates :variant, presence: true
  validates :count, presence: true, numericality: { only_integer: true, greater_than: 0 }

  # Can pieces move through/over this terrain
  validates :passable_movement_effect_type, inclusion: { in: EFFECT_TYPES }

  # Does this terrain slow the movement speed of pieces moving through/over this terrain
  validates :slows_movement_effect_type, inclusion: { in: EFFECT_TYPES }
  validates :slows_movement_by, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, unless: lambda { |r| r.slows_movement_effect_type == 'none' }

  # Does this terrain stop the movement speed of pieces moving through/over this terrain
  validates :stops_movement_effect_type, inclusion: { in: EFFECT_TYPES }

  # Can pieces range capture through/over this terrain
  validates :passable_range_effect_type, inclusion: { in: EFFECT_TYPES }

  ########################################
  # Callbacks
  ########################################

  before_save :clean_piece_type_ids

  def clean_piece_type_ids
    [:passable_movement, :passable_range, :slows_movement, :stops_movement].each do |action|
      self["#{action}_effect_piece_type_ids"] ||= []
      self["#{action}_effect_piece_type_ids"].reject!{ |x| x.blank? }
    end
  end

  ########################################
  # Instance Methods
  ########################################

  def rule_descriptions
    (movement_descriptions + range_descriptions).compact
  end

  def movement_descriptions
    out = [passable_movement_description]

    if passable_movement_effect_type != 'none'
      out << stops_movement_description if stops_movement_effect_type != 'none'
      out << slows_movement_description if slows_movement_effect_type != 'none'
    end

    out
  end

  def range_descriptions
    [passable_range_description]
  end

  def passable_movement_description
    who = Messages.effect_description(self, 'passable_movement')
    "#{who} can move through / over"
  end

  def passable_range_description
    who = Messages.effect_description(self, 'passable_range')
    "#{who} can range capture through / over"
  end

  def slows_movement_description
    who = Messages.effect_description(self, 'slows_movement')
    "slows movement for #{who} by #{slows_movement_by}"
  end

  def stops_movement_description
    who = Messages.effect_description(self, 'stops_movement')
    "stops movement for #{who}"
  end

  def effects?(type, piece_type_id)
    return false unless respond_to? "#{type}_effect_type"

    ids = public_send("#{type}_effect_piece_type_ids")
    value = public_send("#{type}_effect_type")
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

  def passable?(type, piece_type_id)
    effects?("passable_#{type}", piece_type_id)
  end

  def slows?(type, piece_type_id)
    effects?("slows_#{type}", piece_type_id)
  end

  def slows_by(type)
    if type == 'movement'
      slows_movement_by
    else
      0
    end
  end

  def stoppable?(type, piece_type_id)
    if type == 'movement'
      passable?(type, piece_type_id)
    else
      true
    end
  end

  def stops?(type, piece_type_id)
    effects?("stops_#{type}", piece_type_id)
  end

end