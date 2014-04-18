require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_storage/coordinate_map.rb'
require ROOT_DIRECTORY + '/app/game_storage/piece.rb'
require ROOT_DIRECTORY + '/app/game_storage/terrain.rb'

describe CoordinateMap do
  let(:coordinate_map) { CoordinateMap.new(game, field, data) }
  let(:game) { double :game, :[]= => nil, save: nil }
  let(:field) { :initial_setup_json }
  let(:data) { nil }

  let(:initial_setup_json) { nil }
  let(:klass) { Piece }
  let(:object) { klass.new(game, {coordinate: {'x'=>0, 'y'=>0}, type_id: 1, user_id: 1}) }
  before { game.stub(:[]).with(field).and_return(initial_setup_json) }

  context '#initialize' do
    context 'data is nil' do
      let(:data) { nil }

      context 'game[field] is nil' do
        let(:initial_setup_json) { nil }

        it 'sets data to {}' do
          expect(coordinate_map.data).to eql({})
        end
      end

      context 'game[field] is not nil' do
        let(:initial_setup_json) { { a: 1 } }

        it 'sets data to game[field]' do
          expect(coordinate_map.data).to eql({ a: 1 })
        end
      end
    end

    context 'data is not nil' do
      let(:data) { { a: 2 } }

      it 'sets data to data' do
        expect(coordinate_map.data).to eql({ a: 2 })
      end
    end
  end

  context '#get' do
    it 'returns nil if nothing there' do
      stored = coordinate_map.get({'x'=>0, 'y'=>0}, klass)
      expect(stored).to be_nil
    end
  end

  context '#add' do
    it 'adds the object to the data' do
      coordinate_map.add(object)
      stored = coordinate_map.get({'x'=>0, 'y'=>0}, klass)
      expect(stored).to be_a(klass)
    end

    it 'updates the field' do
      expect(game).to receive(:[]=).with(:initial_setup_json, anything)
      coordinate_map.add(object)
    end
  end

  context '#move' do
    before do
      coordinate_map.add(object)
    end

    it 'removes the object at the old coordinate' do
      coordinate_map.move(object, {'x'=>2, 'y'=>2})
      stored = coordinate_map.get({'x'=>0, 'y'=>0}, klass)
      expect(stored).to be_nil
    end

    it 'adds the object at the new coordinate' do
      coordinate_map.move(object, {'x'=>2, 'y'=>2})
      stored = coordinate_map.get({'x'=>2, 'y'=>2}, klass)
      expect(stored).to be_a(klass)
    end

    it 'updates the field' do
      expect(game).to receive(:[]=).with(:initial_setup_json, anything).twice
      coordinate_map.move(object, {'x'=>2, 'y'=>2})
    end
  end

  context '#remove' do
    before do
      coordinate_map.add(object)
    end

    it 'removes the object from the data' do
      coordinate_map.remove(object)
      stored = coordinate_map.get({'x'=>0, 'y'=>0}, klass)
      expect(stored).to be_nil
    end

    it 'updates the field' do
      expect(game).to receive(:[]=).with(:initial_setup_json, anything)
      coordinate_map.remove(object)
    end
  end

  context '#for_user_id' do
    let(:user_id) { 1000 }
    let(:opponent_id) { 1001 }
    let(:board) { double :board }
    let(:object1) { klass.new(game, {coordinate: {'x'=>0, 'y'=>0}, type_id: 1, user_id: user_id}) }
    let(:object2) { klass.new(game, {coordinate: {'x'=>7, 'y'=>7}, type_id: 1, user_id: opponent_id}) }
    let(:result) { coordinate_map.for_user_id(user_id) }

    before do
      coordinate_map.add(object1)
      coordinate_map.add(object2)
      game.stub(:board).and_return(board)
      game.stub(:color).with(user_id).and_return('alabaster')
      board.stub(:territory).with({'x'=>0, 'y'=>0}).and_return('alabaster')
      board.stub(:territory).with({'x'=>7, 'y'=>7}).and_return('onyx')
    end

    it 'returns a CoordinateMap' do
      expect(result).to be_a(CoordinateMap)
    end

    it 'has the users objects' do
      stored = result.get({'x'=>0, 'y'=>0}, klass)
      expect(stored).to be_a(klass)
    end

    it 'does not have the opponents objects' do
      stored = result.get({'x'=>7, 'y'=>7}, klass)
      expect(stored).to be_nil
    end
  end

  context '#for_class' do
    let(:klass1) { Piece }
    let(:klass2) { Terrain }
    let(:object1) { klass1.new(game, {coordinate: {'x'=>0, 'y'=>0}, type_id: 1, user_id: 1}) }
    let(:object2) { klass1.new(game, {coordinate: {'x'=>0, 'y'=>1}, type_id: 1, user_id: 1}) }
    let(:object3) { klass2.new(game, {coordinate: {'x'=>0, 'y'=>2}, type_id: 1, user_id: 1}) }

    before do
      coordinate_map.add(object1)
      coordinate_map.add(object2)
    end

    context 'two objects present' do
      it 'returns an array of objects of that type' do
        result = coordinate_map.for_class(klass1)
        expect(result.count).to eq 2
        expect(result[0]).to be_a(klass1)
        expect(result[1]).to be_a(klass1)
      end
    end

    context 'one object present' do
      before do
        coordinate_map.add(object3)
      end

      it 'returns an array of objects of that type' do
        result = coordinate_map.for_class(klass2)
        expect(result.count).to eq 1
        expect(result[0]).to be_a(klass2)
      end
    end

    context 'no objects present' do
      it 'returns an array of objects of that type' do
        result = coordinate_map.for_class(klass2)
        expect(result.count).to eq 0
      end
    end
  end
end
