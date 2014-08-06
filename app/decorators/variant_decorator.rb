class VariantDecorator < Draper::Decorator
  delegate_all
  decorates_association :piece_rules
  decorates_association :terrain_rules

  def board_description
    if square_board?
      "Square Board (#{board_rows}x#{board_columns})"
    else
      "Hexagonal Board (size #{board_size})"
    end
  end

  def piece_ranks_description
    if piece_ranks?
      'Pieces can only capture units of the same rank or lower'
    else
      'Pieces can capture all other pieces'
    end
  end

  def to_s
    "Cyvasse by #{user.username}"
  end

end
