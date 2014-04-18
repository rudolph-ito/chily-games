class CoordinateMap

  attr_accessor :game, :data, :field

  def initialize(game, field, data = nil)
    @game = game
    @field = field
    @data = data || game[field] || {}
  end

  def get(coordinate, klass)
    key = encode_coordinate(coordinate)
    attrs = data.fetch(key, {}).fetch(klass.to_s, nil)
    klass.decode(coordinate, game, attrs) if attrs
  end

  def add(object)
    key = encode_coordinate(object.coordinate)
    data[key] ||= {}
    data[key][object.class.to_s] = object.encode
    set_field
  end

  def move(object, new_coordinate)
    remove(object)
    object.coordinate = new_coordinate
    add(object)
  end

  def remove(object)
    key = encode_coordinate(object.coordinate)
    data[key].delete(object.class.to_s)
    data.delete(key) if data[key].empty?
    set_field
  end

  def for_user_id(user_id)
    user_color = game.color(user_id)

    user_data = data.select do |k,v|
      user_color == game.board.territory( decode_coordinate(k) )
    end

    CoordinateMap.new(game, nil, user_data)
  end

  def for_class(klass)
    data.map do |k,v|
      coordinate = decode_coordinate(k)
      attrs = v[klass.to_s]
      klass.decode(coordinate, game, attrs) if attrs
    end.compact
  end

  private

  def set_field
    game[field] = data
  end

  def decode_coordinate(string)
    values = string.split(',').map(&:to_i)
    out = {'x' => values[0].to_i, 'y' => values[1].to_i}
    out['z'] = values[2].to_i if values.count == 3
    out
  end

  def encode_coordinate(hash)
    return '' unless hash.is_a?(Hash)
    out = [hash['x'], hash['y']]
    out << hash['z'] if hash.keys.count == 3
    out.join(',')
  end

end
