class PlyData
  attr_accessor :capture, :coordinate, :directional_functions, :minimum, :maximum, :piece_type_id, :type, :user

  def initialize(piece, board, type)
    @coordinate = piece.coordinate
    @piece_type_id = piece.piece_type_id
    @user = piece.user
    @type = type

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
