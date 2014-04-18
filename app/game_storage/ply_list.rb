class PlyList

  attr_accessor :game, :field, :data

  def initialize(game, field, data = nil)
    @game = game
    @field = field
    @data = data || game[field] || []
  end

  def add(ply)
    data << ply
    game[field] = data
  end

  def to_a
    data
  end

end
