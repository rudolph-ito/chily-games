require 'spec_helper'

describe Game do
  context 'validating' do
    let(:game) { build(:game, game_params) }
    let(:game_params) { {} }

    context 'action' do
      context 'equal to setup' do
        let(:game_params) { {action: 'setup'} }
        specify { game.should be_valid }
      end

      context 'equal to move' do
        let(:game_params) { {action: 'move'} }
        specify { game.should be_valid }
      end

      context 'equal to anything else' do
        let(:game_params) { {action: nil} }
        specify { game.should be_invalid }
      end
    end

    context 'no alabaster' do
      let(:game_params) { {alabaster: nil} }
      specify { game.should be_invalid }
    end

    context 'no onyx' do
      let(:game_params) { {onyx: nil} }
      specify { game.should be_invalid }
    end

    context 'no variant' do
      let(:game_params) { {variant: nil} }
      specify { game.should be_invalid }
    end
  end

  describe '#color' do
    let(:alabaster_id) { 1000 }
    let(:onyx_id) { 1001 }
    let(:game) { build(:game, alabaster_id: alabaster_id, onyx_id: onyx_id) }

    context 'argument is alabaster id' do
      specify { expect(game.color(alabaster_id)).to eql('alabaster') }
    end

    context 'argument is onyx id' do
      specify { expect(game.color(onyx_id)).to eql('onyx') }
    end
  end

  describe '#opponent_id' do
    let(:alabaster_id) { 1000 }
    let(:onyx_id) { 1001 }
    let(:game) { build(:game, alabaster_id: alabaster_id, onyx_id: onyx_id) }

    context 'argument is alabaster id' do
      specify { expect(game.opponent_id(alabaster_id)).to eql(onyx_id) }
    end

    context 'argument is onyx id' do
      specify { expect(game.opponent_id(onyx_id)).to eql(alabaster_id) }
    end
  end

  describe '#next_action_to_id' do
    let(:alabaster_id) { 1000 }
    let(:onyx_id) { 1001 }
    let(:game) { build(:game, alabaster_id: alabaster_id, onyx_id: onyx_id, action_to_id: action_to_id) }

    context 'action_to_id == alabaster_id' do
      let(:action_to_id) { alabaster_id }
      specify { expect(game.next_action_to_id).to eql(onyx_id) }
    end

    context 'action_to_id == onyx_id' do
      let(:action_to_id) { onyx_id }
      specify { expect(game.next_action_to_id).to eql(alabaster_id) }
    end
  end
end
