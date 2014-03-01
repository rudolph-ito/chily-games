class PlyValidator
  attr_reader :game, :piece, :to, :range_capture

  def initialize(game, piece, to, range_capture = nil)
    @game = game
    @piece = piece
    @to = to
    @range_capture = range_capture
  end

  def call
    movement_valid? and (no_range_capture? or range_capture_valid?)
  end

  private

  def movement_valid?
    ply_calculator.valid_plies(piece, piece.coordinate, 'movement').include?(to)
  end

  def no_range_capture?
    !piece.rule.range_capture?|| range_capture.nil?
  end

  def range_capture_valid?
    ply_calculator.valid_plies(piece, to, 'range').include?(range_capture)
  end

  def ply_calculator
    PlyCalculator.new(game.board, game.current_setup)
  end

end
