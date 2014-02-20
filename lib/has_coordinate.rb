# Module to encode / decode a coordinate
#
# Square boards have coordinates with keys 'x', 'y'
# {'x' => 1, 'y' => -1} will be encoded as '1,-1'
#
# Hexagonal boards have coordinates with keys 'x', 'y', 'z'
# {'x' => 1, 'y' => 0, 'z' => -1} will be encoded as '1,0,-1'

module HasCoordinate
  def self.included(base)
    base.class_eval do
      validate :validate_cooridinate_for_game
      validates :encoded_coordinate, presence: true, uniqueness: { scope: :game_id }
      scope :for_coordinate, -> (coordinate) { where(encoded_coordinate: self.encode_coordinate(coordinate)) }
    end

    base.extend(ClassMethods)
  end

  def reload
    @coordinate = nil
    super
  end

  def coordinate
    @coordinate ||= self.class.decode_coordinate( encoded_coordinate )
  end

  def coordinate=(hash)
    @coordinate = nil
    self.encoded_coordinate = self.class.encode_coordinate(hash)
  end

  def validate_cooridinate_for_game
    return unless game

    errors.add(:coordinate, 'is off the board') unless game.board.coordinate_valid?(coordinate)

    if game.action == 'setup'
      territory = game.board.territory(coordinate)
      if territory == 'neutral'
        errors.add(:coordinate, 'is in neutral territory')
      elsif territory != game.color(user_id)
        errors.add(:coordinate, 'is in enemy territory')
      end
    end
  end

  private

  module ClassMethods
    def find_by_coordinate(coordinate)
      for_coordinate(coordinate).first
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
end
