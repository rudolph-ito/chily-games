module TerrainRulesHelper

  def effect_types
    {
      'none' => 'none',
      'all' => 'all',
      'only the following' => 'include',
      'all except the following' => 'exclude'
    }
  end

  def serialize_piece_types(piece_types)
    piece_types.map{ |pr| [pr.name, pr.id.to_s]}
  end

  def piece_types(variant)
    piece_types = variant.piece_rules.map(&:piece_type).map
    serialize_piece_types piece_types
  end

  def piece_types_with_range_capture(variant)
    piece_types = variant.piece_rules.select{ |pr| pr.range_capture? }.map(&:piece_type)
    serialize_piece_types piece_types
  end

end
