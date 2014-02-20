class BoardFactory

  def self.instance(variant)
    case variant.board_type
    when 'square'
      SquareBoard.new(variant.board_rows, variant.board_columns)
    when 'hexagonal'
      HexagonalBoard.new(variant.board_size)
    else
      raise "#{self}.instance does not support varaint with board_type: #{variant.board_type}"
    end
  end
end
