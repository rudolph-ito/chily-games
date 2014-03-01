class Terrain

  attr_accessor :coordinate, :game, :terrain_type_id, :user_id

  def initialize(coordinate, game, terrain_type_id, user_id)
    @coordinate = coordinate
    @game = game
    @terrain_type_id = terrain_type_id
    @user_id = user_id
  end

  def terrain_type
    TerrainType.find(terrain_type_id)
  end

  def color
    game.color(user_id)
  end

  def rule
    game.variant.terrain_rules.find_by(terrain_type_id: terrain_type_id)
  end

  def encode
    [terrain_type_id.to_i, user_id.to_i]
  end

  def self.decode(coordinate, game, data)
    self.new(coordinate, game, data[0], data[1])
  end

end
