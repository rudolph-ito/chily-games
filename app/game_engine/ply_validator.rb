class PlyValidator

  def initialize(game, user, piece, to, range_capture)
    @user = user
    @piece = piece
    @from = piece.coordinate
    @to = to
    @range_capture = range_capture

    @ply_calculator = PlyCalculator.new(game.board, game.current_setup)
  end

  def call
    return false unless @user.id == @piece.user_id

    if can_range_capture?
      range_capture_ply_valid?
    else
      movement_ply_valid?
    end
  end

  private

  def range_capture_ply_valid?
    if no_movement?
      range_capture_valid?(@from)
    elsif no_range_capture?
      movement_valid?
    elsif can_move_and_range_capture?
      movement_valid? and range_capture_valid?(@to)
    else
      false
    end
  end

  def movement_ply_valid?
    movement_valid?
  end

  def can_range_capture?
    @piece.rule.range_capture?
  end

  def can_move_and_range_capture?
    @piece.rule.move_and_range_capture?
  end

  def no_movement?
    @to.nil?
  end

  def no_range_capture?
    @range_capture.nil?
  end

  def movement_valid?
    return false if no_movement?
    @ply_calculator.valid_plies(@piece, @from, 'movement').include?(@to)
  end

  def range_capture_valid?(coordinate)
    return false if no_range_capture?
    @ply_calculator.valid_plies(@piece, coordinate, 'range').include?(@range_capture)
  end

end
