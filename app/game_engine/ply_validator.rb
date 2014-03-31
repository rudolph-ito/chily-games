class PlyValidator
  attr_reader :game, :piece, :from, :range_capture, :to

  def initialize(game, piece, to, range_capture)
    @game = game
    @piece = piece
    @from = piece.coordinate
    @to = to
    @range_capture = range_capture
  end

  def call
    if range_capture?
      if to.nil?
        range_capture_valid?(from)
      elsif range_capture.nil?
        movement_valid?
      elsif move_and_range_capture?
        movement_valid? and range_capture_valid?(to)
      else
        false
      end
    else
      movement_valid?
    end
  end

  private

  def range_capture?
    piece.rule.range_capture?
  end

  def move_and_range_capture?
    piece.rule.move_and_range_capture?
  end

  def movement_valid?
    return false if to.nil?
    ply_calculator.valid_plies(piece, from, 'movement').include?(to)
  end

  def range_capture_valid?(coordinate)
    return false if range_capture.nil?
    ply_calculator.valid_plies(piece, coordinate, 'range').include?(range_capture)
  end

  def ply_calculator
    PlyCalculator.new(game.board, game.current_setup)
  end

end
