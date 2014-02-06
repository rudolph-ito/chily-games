class PlyData
  attr_accessor :capture, :coordinate, :directional_functions, :minimum, :maximum, :piece, :type, :user

  def initialize(piece, board, type)
    @type = type
    @coordinate = piece.coordinate
    @user = piece.user

    rule = piece.rule

    @directional_type = rule.public_send "#{type}_type"
    @minimum = rule.public_send "#{type}_minimum"
    @maximum = rule.public_send "#{type}_maximum"
    @capture = rule.capture_type == type

    @directional_functions = []
    @directional_functions += board.movement_function('orthogonal') if @directional_type.include?('orthogonal')
    @directional_functions += board.movement_function('diagonal') if @directional_type.include?('diagonal')
  end

  def line?
    @directional_type.end_with?('line')
  end
end
