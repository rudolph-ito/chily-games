class SquareBoard < Board

  def coordinate_valid?(coordinate)
    0 <= coordinate['x'] && coordinate['x'] < @variant.board_columns && 0 <= coordinate['y'] && coordinate['y'] < @variant.board_rows
  end

  def center_coordinate
    { 'x' => @variant.board_columns / 2, 'y' => @variant.board_rows / 2 }
  end

  def territory(coordinate)
    if @variant.board_rows.odd? && coordinate['y'] == @variant.board_rows / 2
      'neutral'
    elsif coordinate['y'] < @variant.board_rows / 2
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
        lambda{ |coordinate| coordinate['y'] -= 1}
      ]
    else # type == 'diagonal'
      [
        lambda{ |coordinate| coordinate['x'] += 1; coordinate['y'] += 1},
        lambda{ |coordinate| coordinate['x'] += 1; coordinate['y'] -= 1},
        lambda{ |coordinate| coordinate['x'] -= 1; coordinate['y'] += 1},
        lambda{ |coordinate| coordinate['x'] -= 1; coordinate['y'] -= 1}
      ]
    end
  end

end