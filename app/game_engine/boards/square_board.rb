class SquareBoard

  attr_reader :rows, :columns

  def initialize(rows, columns)
    @rows = rows
    @columns = columns
  end

  def coordinate_valid?(coordinate)
    0 <= coordinate['x'] && coordinate['x'] < columns && 0 <= coordinate['y'] && coordinate['y'] < rows
  end

  def reduce_coordinate(coordinate)
    coordinate
  end

  def center_coordinate
    { 'x' => columns / 2, 'y' => rows / 2 }
  end

  def territory(coordinate)
    if rows.odd? && coordinate['y'] == rows / 2
      'neutral'
    elsif coordinate['y'] < rows / 2
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
        lambda{ |coordinate| coordinate['y'] -= 1}
      ]
    elsif type == 'diagonal'
      [
        lambda{ |coordinate| coordinate['x'] += 1; coordinate['y'] += 1},
        lambda{ |coordinate| coordinate['x'] += 1; coordinate['y'] -= 1},
        lambda{ |coordinate| coordinate['x'] -= 1; coordinate['y'] += 1},
        lambda{ |coordinate| coordinate['x'] -= 1; coordinate['y'] -= 1}
      ]
    else
      raise "#{self.class}#directional_functions does not support type: #{type}"
    end
  end
end
