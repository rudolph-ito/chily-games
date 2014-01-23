require 'spec_helper'

describe Challenge do
  describe 'validating' do
    let(:challenge) { build(:challenge, challenge_params) }
    let(:challenge_params) { {} }

    context 'with the default factory' do
      specify { challenge.should be_valid }
    end

    context 'no challenger' do
      let(:challenge_params) { {challenger: nil} }
      specify { challenge.should be_invalid }
    end
  end

  describe '#create_game_with' do
    let(:user1) { create(:user) }
    let(:user2) { create(:user) }
    let(:challenge) { create(:challenge, {challenger: user1}.merge(challenge_params) ) }

    context 'play as alabaster' do
      let(:challenge_params) { { play_as: 'alabaster' } }
      it 'creates a game' do
        expect { challenge.create_game_with(user2) }.to change(Game, :count).by(1)
        game = Game.last
        expect(game.alabaster).to eql(user1)
        expect(game.onyx).to eql(user2)
      end
    end

    context 'play as onyx' do
      let(:challenge_params) { { play_as: 'onyx' } }
      it 'creates a game' do
        expect { challenge.create_game_with(user2) }.to change(Game, :count).by(1)
        game = Game.last
        expect(game.alabaster).to eql(user2)
        expect(game.onyx).to eql(user1)
      end
    end

    context 'play as random' do
      let(:challenge_params) { { play_as: 'random' } }
      it 'creates a game' do
        expect { challenge.create_game_with(user2) }.to change(Game, :count).by(1)
        game = Game.last
        expect([game.alabaster, game.onyx]).to match_array([user1, user2])
      end
    end
  end
end
