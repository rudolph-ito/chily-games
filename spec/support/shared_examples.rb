RSpec::Matchers.define :a_coordinate_where_to_is do |expected|
  match do |actual|
    actual['to'] == expected
  end

  description do
    "a coordinate where to is '#{expected}'"
  end
end

shared_examples "match coordinate validity" do |proper|
  specify do
    valid_plies = game.valid_plies(piece)

    proper[:valid].each do |short_coordinate|
      coordinate = {}
      coordinate['x'] = short_coordinate[0]
      coordinate['y'] = short_coordinate[1]
      coordinate['z'] = short_coordinate[2] if short_coordinate.count == 3

      valid_plies.should include( a_coordinate_where_to_is coordinate )
    end

    proper[:invalid].each do |short_coordinate|
      coordinate = {}
      coordinate['x'] = short_coordinate[0]
      coordinate['y'] = short_coordinate[1]
      coordinate['z'] = short_coordinate[2] if short_coordinate.count == 3

      valid_plies.should_not include( a_coordinate_where_to_is coordinate )
    end
  end
end