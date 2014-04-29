module TerrainRulesHelper

  def effect_types
    {
      'none' => 'none',
      'all' => 'all',
      'only the following' => 'include',
      'all except the following' => 'exclude'
    }
  end

  def piece_types(variant)
    variant.piece_rules.map(&:piece_type)
  end

  def piece_types_with_range_capture(variant)
    variant.piece_rules.select{ |pr| pr.range_capture? }.map(&:piece_type)
  end

end
