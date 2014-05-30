class HexagonalBoard

  attr_reader :size

  def initialize(size)
    @size = size
  end

  def coordinate_valid?(coordinate)
    sum = coordinate['x'] + coordinate['y']

    coordinate['x'].between?(0, 2 * size) &&
    coordinate['y'].between?(0, 2 * size) &&
    sum.between?(size, size + 2 * size)
  end

  def center_coordinate
    { 'x' => size, 'y' => size }
  end

  def territory(coordinate)
    if coordinate['y'] == size
      'neutral'
    elsif coordinate['y'] < size
      'alabaster'
    else
      'onyx'
    end
  end

  def directional_functions(type)
    if type == 'orthogonal'
      [
        lambda{ |coordinate| coordinate['x'] += 1},
        lambda{ |coordinate| coordinate['x'] -= 1},
        lambda{ |coordinate| coordinate['y'] += 1},
        lambda{ |coordinate| coordinate['y'] -= 1},
        lambda{ |coordinate| coordinate['x'] += 1; coordinate['y'] -= 1},
        lambda{ |coordinate| coordinate['x'] -= 1; coordinate['y'] += 1}
      ]
    elsif type == 'diagonal'
      [
        lambda{ |coordinate| coordinate['x'] += 1; coordinate['y'] += 1},
        lambda{ |coordinate| coordinate['x'] -= 1; coordinate['y'] -= 1},
        lambda{ |coordinate| coordinate['x'] += 1; coordinate['y'] -= 2},
        lambda{ |coordinate| coordinate['x'] -= 1; coordinate['y'] += 2},
        lambda{ |coordinate| coordinate['x'] += 2; coordinate['y'] -= 1},
        lambda{ |coordinate| coordinate['x'] -= 2; coordinate['y'] += 1}
      ]
    else
      raise "#{self.class}#directional_functions does not support type: #{type}"
    end
  end

  def distance(coordinate1, coordinate2)
    x_diff = coordinate1['x'] - coordinate2['x']
    y_diff = coordinate1['y'] - coordinate2['y']
    d_diff = x_diff + y_diff

    [x_diff, y_diff, d_diff].map(&:abs).max
  end
end
