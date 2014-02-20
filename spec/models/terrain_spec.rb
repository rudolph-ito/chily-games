require 'spec_helper'

describe Terrain do
  context 'validating' do
    let(:terrain) { build(:terrain, terrain_params) }
    let(:terrain_params) { {} }

    context 'game is required' do
      let(:terrain_params) { {game: nil} }
      specify { terrain.should be_invalid }
    end

    context 'user is required' do
      let(:terrain_params) { {user: nil} }
      specify { terrain.should be_invalid }
    end

    context 'terrain_type is required' do
      let(:terrain_params) { {terrain_type: nil} }
      specify { terrain.should be_invalid }
    end

    context 'coordinate is required' do
      let(:terrain_params) { {coordinate: nil} }
      specify { terrain.should be_invalid }
    end

    context 'coordinate is a duplicate' do
      let(:terrain_params) { {coordinate: {'x' => 0, 'y' => 0} } }
      let(:other_terrain) { build(:terrain, terrain_params) }
      specify { terrain.should be_invalid }
    end

    context 'game is in setup' do
      let(:game) { create :game, variant: create(:variant_with_hexagonal_board) }

      context 'placed in home territory' do
        let(:terrain_params) { {game: game, user: game.alabaster, coordinate: {'x'=>0, 'y'=>0, 'z'=>1} } }
        specify { terrain.should be_valid }
      end

      context 'placed in netural territory' do
        let(:terrain_params) { {game: game, user: game.alabaster, coordinate: {'x'=>0, 'y'=>0, 'z'=>0} } }
        specify { terrain.should be_invalid }
      end

      context 'placed in enemy territory' do
        let(:terrain_params) { {game: game, user: game.alabaster, coordinate: {'x'=>0, 'y'=>0, 'z'=>-1} } }
        specify { terrain.should be_invalid }
      end
    end
  end

  describe '#rule' do
    let(:game) { create(:game, action: 'move') }
    let(:terrain) { create(:terrain, game: game) }
    let!(:terrain_rule) { create(:terrain_rule, terrain_type: terrain.terrain_type, variant: game.variant)}

    it 'returns the rule' do
      expect(terrain.rule).to eql(terrain_rule)
    end
  end
end
