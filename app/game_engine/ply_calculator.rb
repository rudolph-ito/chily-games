class PlyCalculator

  attr_reader :board, :coordinate_map
  attr_accessor :capture, :capture_only, :directional_functions, :from, :ignore_capture_restriction, :minimum, :maximum, :piece, :piece_type_id, :rule, :type, :user_id

  def initialize(board, coordinate_map)
    @board = board
    @coordinate_map = coordinate_map
  end

  def valid_plies(piece, from, type, opts = {})
    @piece = piece
    @from = from
    @type = type

    setup(opts)

    if line?
      PlyCalculator::LinePlyCalculator.new(self).call
    else
      PlyCalculator::TurnPlyCalculator.new(self).call
    end
  end

  def evaluator
    PlyCalculator::PlyEvaluator.new(self)
  end

  private

  def line?
    @directional_type.end_with?('line')
  end

  def setup(opts)
    @ignore_capture_restriction = opts[:ignore_capture_restriction] || false

    @piece_type_id = piece.type_id
    @user_id = piece.user_id
    @rule = piece.rule

    @directional_type = rule.public_send "#{type}_type"
    @minimum = rule.public_send "#{type}_minimum"
    @maximum = rule.public_send "#{type}_maximum"
    @capture = rule.capture_type == type
    @capture_only = type == "range"

    @directional_functions = []
    @directional_functions += board.directional_functions('orthogonal') if @directional_type.include?('orthogonal')
    @directional_functions += board.directional_functions('diagonal') if @directional_type.include?('diagonal')
  end

end
