class MoveInInitialSetup

  attr_accessor :game, :object, :to

  def initialize(game, user, from, to, type)
    @game = game
    @object = game.setup_for_user(user).get(from, type)
    @to = to
  end

  def call
    if should_move_object?
      game.initial_setup.move(object, to)
      game.save
    end
  end

  private

  def should_move_object?
    !object.nil? && board.coordinate_valid?(to) && board.territory(to) == object.color
  end

  def board
    game.board
  end

end
