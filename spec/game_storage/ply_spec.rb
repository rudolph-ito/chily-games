require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_storage/ply.rb'
require ROOT_DIRECTORY + '/app/game_storage/piece.rb'

describe Ply do
  let(:ply) { Ply.new(game, piece, to, range_capture) }
  let(:game) { double :game, action_to_id: action_to_id, current_setup: current_setup, complete?: true, next_action_to_id: next_action_to_id, update_attributes: nil }
  let(:action_to_id) { 1000 }
  let(:next_action_to_id) { 1001 }
  let(:current_setup) { double :current_setup, get: nil, move: nil, remove: nil }
  let(:piece) { double :piece }

  shared_examples 'game action behavior' do
    context 'king taken' do
      before { game.stub(:complete?).and_return(true) }

      it 'updates action to "complete"' do
        ply.call
        expect(game).to have_received(:update_attributes).with(action: 'complete')
      end
    end

    context 'king not taken' do
      before { game.stub(:complete?).and_return(false) }

      it 'updates action_to_id to next_action_to_id' do
        ply.call
        expect(game).to have_received(:update_attributes).with(action_to_id: next_action_to_id)
      end
    end
  end

  shared_examples 'range capture behavior' do
    context 'piece captured' do
      let(:opponent_piece) { double :piece }
      before { current_setup.stub(:get).with(range_capture, Piece).and_return(opponent_piece) }
      include_examples 'game action behavior'

      it 'removes the piece at the range capture' do
        ply.call
        expect(current_setup).to have_received(:remove).with(opponent_piece)
      end
    end

    context 'piece not captured' do
      before { current_setup.stub(:get).with(range_capture, Piece).and_return(nil) }

      it 'does not call remove' do
        ply.call
        expect(current_setup).to_not have_received(:remove)
      end
    end
  end

  describe '#call' do
    context 'movement only' do
      let(:to) { {'x'=>0, 'y'=>1} }
      let(:range_capture) { nil }

      it 'moves the piece' do
        ply.call
        expect(current_setup).to have_received(:move).with(piece, to)
      end

      include_examples 'game action behavior'
    end

    context 'range_capture only' do
      let(:to) { nil }
      let(:range_capture) { {'x'=>0, 'y'=>1} }

      it 'does not move the piece' do
        ply.call
        expect(current_setup).to_not have_received(:move)
      end

      include_examples 'range capture behavior'
    end

    context 'movement and range_capture' do
      let(:to) { {'x'=>0, 'y'=>1} }
      let(:range_capture) { {'x'=>0, 'y'=>2} }

      it 'moves the piece' do
        ply.call
        expect(current_setup).to have_received(:move).with(piece, to)
      end

      include_examples 'range capture behavior'
    end
  end
end
