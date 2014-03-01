class PlyCalculator

  attr_reader :board, :coordinate_map

  def initialize(board, coordinate_map)
    @board = board
    @coordinate_map = coordinate_map
  end

  def valid_plies(piece, from, type = 'movement')
    ply_data = PlyData.new(piece, from, board, type)

    if ply_data.line?
      line_plies(ply_data, from)
    else
      turn_plies(ply_data, from)
    end
  end

  private

  # Returns all plies for movement in a line
  def line_plies(ply_data, from)
    plies = []

    ply_data.directional_functions.each do |directional_function|
      to = from.clone
      movement_count = 0

      while !(ply_data.maximum && movement_count == ply_data.maximum)
        directional_function.call(to)
        to = board.reduce_coordinate(to)
        movement_count += 1

        continue, valid = evaluate_ply(ply_data, to, movement_count)
        plies << to.clone if valid
        break unless continue
      end
    end

    plies
  end

  # Returns all plies for movement with turns
  def turn_plies(ply_data, from)
    _turn_plies(ply_data, from, 0)
  end

  # Recursive function for turn_plies
  #
  # piece = piece that is moving
  # coordinate = where the piece is moving from this deep in the search
  # movement_count = number of spaces moved from ply_data.from to coordinate
  def _turn_plies(ply_data, coordinate, movement_count)
    return [] if ply_data.maximum && movement_count == ply_data.maximum

    plies = []

    ply_data.directional_functions.each do |directional_function|
      to = coordinate.clone
      directional_function.call(to)
      to = board.reduce_coordinate(to)

      # Stop if distance did not grow
      next if CoordinateDistance.calculate(ply_data.from, coordinate) >= CoordinateDistance.calculate(ply_data.from, to)

      continue, valid = evaluate_ply(ply_data, to, movement_count + 1)
      plies << to.clone if valid
      next unless continue

      # Continue
      plies += _turn_plies(ply_data, to, movement_count + 1)
    end

    plies.uniq
  end

  # Shared ply evaluation between line_plies and turn_plies
  #
  # Returns [stop, valid]
  def evaluate_ply(ply_data, to, movement_count)
    continue = true

    # Stop if off the board
    return [false, false] unless board.coordinate_valid?(to)

    # Get piece at square (ignore self)
    occupying_piece = coordinate_map.get(to, Piece)

    if occupying_piece && occupying_piece.coordinate != ply_data.piece.coordinate
      # Stop if ran into own piece
      if occupying_piece.user_id == ply_data.user_id
        return [false, false]
      # Stop if ran into enemy piece and cannot capture
      elsif !ply_data.capture
        return [false, false]
      else
        continue = false
      end
    end

    occupying_terrain = coordinate_map.get(to, Terrain)

    if occupying_terrain
      # Stop if ran into blocking terrain
      if occupying_terrain.rule.block?(ply_data.type, ply_data.piece_type_id)
        return [false, false]
      end
    end

    [continue, movement_count >= ply_data.minimum]
  end
end