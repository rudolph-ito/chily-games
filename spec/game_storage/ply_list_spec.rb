require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_storage/ply_list.rb'

describe PlyList do
  let(:ply_list) { PlyList.new(game, field, data) }
  let(:game) { double :game, :[]= => nil, save: nil }
  let(:field) { :plies_json }
  let(:data) { nil }

  let(:plies_json) { nil }
  before { game.stub(:[]).with(field).and_return(plies_json) }

  context '#initialize' do
    context 'data is nil' do
      let(:data) { nil }

      context 'game[field] is nil' do
        let(:plies_json) { nil }

        it 'sets data to []' do
          expect(ply_list.to_a).to eql([])
        end
      end

      context 'game[field] is not nil' do
        let(:plies_json) { ['a'] }

        it 'sets data to game[field]' do
          expect(ply_list.to_a).to eql(['a'])
        end
      end
    end

    context 'data is not nil' do
      let(:data) { ['b'] }

      it 'sets data to data' do
        expect(ply_list.to_a).to eql(['b'])
      end
    end
  end

  context '#add' do
    it 'adds the element to data' do
      expect(ply_list.to_a).to eql([])
      ply_list.add('1')
      expect(ply_list.to_a).to eql(['1'])
    end

    it 'sets the field' do
      ply_list.add('1')
      expect(game).to have_received(:[]=).with(:plies_json, ['1'])
    end
  end
end
