class TerrainRuleDecorator < Draper::Decorator
  delegate_all

  def rule_descriptions
    (movement_descriptions + range_descriptions).compact
  end

  private

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
    who = Messages.effect_description(object, 'passable_movement')
    "#{who} can move through / over"
  end

  def passable_range_description
    who = Messages.effect_description(object, 'passable_range')
    "#{who} can range capture through / over"
  end

  def slows_movement_description
    who = Messages.effect_description(object, 'slows_movement')
    "slows movement for #{who} by #{slows_movement_by}"
  end

  def stops_movement_description
    who = Messages.effect_description(object, 'stops_movement')
    "stops movement for #{who}"
  end

end
