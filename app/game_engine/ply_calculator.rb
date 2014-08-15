class PlyCalculator

  FREE = 'free'
  CAPTURABLE = 'capturable'
  REACHABLE = 'reachable'

  attr_reader :variant, :board, :coordinate_map
  attr_accessor :capture, :capture_only, :directional_functions, :from,
    :minimum, :maximum, :piece, :piece_type_id, :rule, :support, :type, :user_id

  def initialize(variant, board, coordinate_map)
    @variant = variant
    @board = board
    @coordinate_map = coordinate_map
  end

  def valid_plies(piece, from, type, opts = {})
    @piece = piece
    @from = from
    @type = type

    setup(opts)

    result = if line?
      PlyCalculator::LinePlyCalculator.new(self).call
    else
      PlyCalculator::TurnPlyCalculator.new(self).call
    end

    if opts[:all]
      result
    elsif opts[:capture_only]
      result[PlyCalculator::CAPTURABLE]
    elsif opts[:support]
      result[PlyCalculator::CAPTURABLE] + result[PlyCalculator::REACHABLE]
    else
      result[PlyCalculator::FREE] + result[PlyCalculator::CAPTURABLE]
    end
  end

  def evaluator
    PlyCalculator::PlyEvaluator.new(self)
  end

  def empty_plies
    {
      FREE => [],
      CAPTURABLE => [],
      REACHABLE => []
    }
  end

  def copy
    PlyCalculator.new(variant, board, coordinate_map)
  end

  private

  def line?
    @directional_type.end_with?('line')
  end

  def setup(opts)
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

    if variant.allows_support? && !opts[:support]
      pieces = coordinate_map.for_class(Piece)
      pieces.select!{ |p| p.user_id == user_id && p.coordinate != piece.coordinate }
      @support = Support.new(self.copy, pieces)
    end
  end

end
