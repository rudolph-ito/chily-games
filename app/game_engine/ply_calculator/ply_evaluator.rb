class PlyCalculator::PlyEvaluator < SimpleDelegator

  attr_reader :coordinate, :count

  # Returns [valid, stop, count]
  #   valid - (boolean) whether or not `coordinate` should be added to the list of valid plies
  #   flag - (string) what flag this space is given, relevant only if valid == true
  #   stop - (boolean) whether or not to stop looking down this path
  #   count - (int) updated count, relevant only if stop == false
  def call(coordinate, count)
    @coordinate = coordinate
    @count = count

    if invalid_and_stop?
      [false, nil, true, nil]
    else
      [valid, flag, stop, updated_count]
    end
  end

  private

  def invalid_and_stop?
    off_board? || (occupying_piece && type != rule.capture_type)
  end

  def valid
    count_valid? && (no_terrain? || terrain_stoppable?)
  end

  def flag
    if !occupying_piece
      PlyCalculator::FREE
    elsif enemy_piece? && can_capture?
      PlyCalculator::CAPTURABLE
    else
      PlyCalculator::REACHABLE
    end
  end

  def stop
    occupying_piece || blocking_terrain?
  end

  def updated_count
    if no_terrain?
      count
    elsif terrain_stops?
      maximum
    elsif terrain_slows?
      count + terrain_slows_by
    else
      count
    end
  end

  # Helpers

  def occupying_piece
    @occupying_piece ||= coordinate_map.get(coordinate, Piece)
  end

  def occupying_terrain
    @occupying_terrain ||= coordinate_map.get(coordinate, Terrain)
  end


  def off_board?
    !board.coordinate_valid?(coordinate)
  end

  def enemy_piece?
    occupying_piece && occupying_piece.user_id != user_id
  end

  def can_capture?
    return true unless variant.piece_ranks
    occupying_piece.rule.rank <= SupportedRank.new(rule.rank, variant.support_type, supporting_ranks).calculate
  end

  def supporting_ranks
    if support
      support.get(coordinate)
    else
      []
    end
  end

  def count_valid?
    count >= minimum
  end

  def blocking_terrain?
    occupying_terrain && !occupying_terrain.rule.passable?(type, piece_type_id)
  end

  def no_terrain?
    !occupying_terrain
  end

  def terrain_stoppable?
    occupying_terrain.rule.stoppable?(type, piece_type_id)
  end

  def terrain_slows?
    occupying_terrain.rule.slows?(type, piece_type_id)
  end

  def terrain_slows_by
    occupying_terrain.rule.slows_by(type)
  end

  def terrain_stops?
    occupying_terrain.rule.stops?(type, piece_type_id)
  end

end
