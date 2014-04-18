class CreatePly

  attr_accessor :game, :piece, :to, :range_capture

  def initialize(game, piece, to, range_capture)
    @game = game
    @piece = piece
    @to = to
    @range_capture = range_capture
  end

  def call
    add_ply
    move_piece
    range_capture_piece
    update_action
    game.save
  end

  private

  def add_ply
    game.plies.add(from: piece.coordinate, to: to, range_capture: range_capture)
  end

  def move_piece
    return unless should_move_piece?
    game.current_setup.move(piece, to)
  end

  def range_capture_piece
    return unless should_remove_range_captured_piece?
    game.current_setup.remove(range_captured_piece)
  end

  def update_action
    if game.complete?
      game.action = 'complete'
    else
      game.action_to_id = game.next_action_to_id
    end
  end

  def should_move_piece?
    !to.nil?
  end

  def should_remove_range_captured_piece?
    !range_capture.nil? && range_captured_piece
  end

  def range_captured_piece
    game.current_setup.get(range_capture, Piece)
  end

end
