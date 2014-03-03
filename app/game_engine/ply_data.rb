class PlyData
  attr_accessor :capture, :directional_functions, :from, :minimum, :maximum, :piece, :piece_type_id, :type, :user_id

  def initialize(piece, from, board, type)
    @piece = piece
    @from = from
    @type = type

    @piece_type_id = piece.type_id
    @user_id = piece.user_id
    rule = piece.rule

    @directional_type = rule.public_send "#{type}_type"
    @minimum = rule.public_send "#{type}_minimum"
    @maximum = rule.public_send "#{type}_maximum"
    @capture = rule.capture_type == type

    @directional_functions = []
    @directional_functions += board.directional_functions('orthogonal') if @directional_type.include?('orthogonal')
    @directional_functions += board.directional_functions('diagonal') if @directional_type.include?('diagonal')
  end

  def line?
    @directional_type.end_with?('line')
  end
end
