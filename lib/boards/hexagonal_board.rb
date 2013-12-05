class HexagonalBoard < Board

  def coordinate_valid?(coordinate)
    coordinate['x'].abs + coordinate['y'].abs + coordinate['z'].abs <= @variant.board_size - 1
  end

  def reduce_coordinate(coordinate)
    x,y,z = _reduce_coordinate(coordinate['x'], coordinate['y'], coordinate['z'])
    { 'x' => x, 'y' => y, 'z' => z }
  end

  def center_coordinate
    { 'x' => 0, 'y' => 0, 'z' => 0 }
  end

  def territory(coordinate)
    if coordinate['y'] == 0 && coordinate['z'] == 0
      'neutral'
    elsif coordinate['y'] >= 0 && coordinate['z'] >= 0
      'alabaster'
    else
      'onyx'
    end
  end

  def movement_function(type)
    if type == 'orthogonal'
      [
        lambda{ |coordinate| coordinate['x'] += 1},
        lambda{ |coordinate| coordinate['x'] -= 1},
        lambda{ |coordinate| coordinate['y'] += 1},
        lambda{ |coordinate| coordinate['y'] -= 1},
        lambda{ |coordinate| coordinate['z'] += 1},
        lambda{ |coordinate| coordinate['z'] -= 1}
      ]
    else # type == 'diagonal'
      [
        lambda{ |coordinate| coordinate['x'] += 1; coordinate['y'] += 1},
        lambda{ |coordinate| coordinate['x'] -= 1; coordinate['y'] -= 1},
        lambda{ |coordinate| coordinate['x'] += 1; coordinate['z'] -= 1},
        lambda{ |coordinate| coordinate['x'] -= 1; coordinate['z'] += 1},
        lambda{ |coordinate| coordinate['y'] += 1; coordinate['z'] += 1},
        lambda{ |coordinate| coordinate['y'] -= 1; coordinate['z'] -= 1}
      ]
    end
  end

  private

  def _reduce_coordinate(x,y,z)
    # (+x) + (-y) = (-z)    (+x) + (+z) = (+y)    (-y) + (+z) = (-x)
    if (x > 0 && y < 0)  ||  (x > 0 && z > 0)  ||  (y < 0 && z > 0)
      return _reduce_coordinate(x - 1, y + 1, z - 1)
    end

    # (-x) + (+y) = (+z)    (-x) + (-z) = (-y)    (+y) + (-z) = (+x)
    if (x < 0 && y > 0)  ||  (x < 0 && z < 0)  ||  (y > 0 && z < 0)
      return _reduce_coordinate(x + 1, y - 1, z + 1)
    end

    [x,y,z]
  end
end