class SetupValidator

  attr_accessor :game, :user

  def initialize(game, user)
    @game = game
    @user = user
  end

  def call
    errors = count_errors + placement_errors
    [errors.empty?, errors]
  end

  private

  def count_errors
    ['piece', 'terrain'].flat_map do |type|
      game.variant.send("#{type}_rules").map do |rule|
        placed = send("#{type.pluralize}").count{ |o| o.send("type_id") == rule.send("#{type}_type_id") }
        if placed != rule.count
          "Please place #{rule.count_with_name}. You placed #{placed}."
        end
      end
    end.compact
  end

  def placement_errors
    pieces.map do |piece|
      terrain = setup.get(piece.coordinate, Terrain)
      if terrain && terrain.rule.block?('movement', piece.type_id)
        "A #{piece.piece_type.name.downcase} cannot be placed on a #{terrain.terrain_type.name.downcase}."
      end
    end.compact
  end

  def setup
    @setup ||= game.initial_setup.for_user_id(user.id)
  end

  def pieces
    @pieces ||= setup.for_class(Piece)
  end

  def terrains
    @terrains ||= setup.for_class(Terrain)
  end

end