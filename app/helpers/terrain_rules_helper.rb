module TerrainRulesHelper

  def effect_types
    {
      'no pieces' => 'no',
      'all pieces' => 'all',
      'only the following pieces' => 'include',
      'all except the following pieces' => 'exclude'
    }
  end

  def piece_types(variant)
    variant.piece_rules.map(&:piece_type)
  end

  def piece_types_with_range_capture(variant)
    variant.piece_rules.select{ |pr| pr.range_capture? }.map(&:piece_type)
  end

end
