require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_storage/move_piece.rb'
require ROOT_DIRECTORY + '/app/game_storage/piece.rb'

describe MovePiece do
  let(:move_piece) { MovePiece.new(game, piece, to, range_capture) }
  let(:game) { double :game, action_to_id: action_to_id, current_setup: current_setup, complete?: true, next_action_to_id: next_action_to_id, update_attributes: nil }
  let(:action_to_id) { 1000 }
  let(:next_action_to_id) { 1001 }
  let(:current_setup) { double :current_setup, move: nil, remove: nil }
  let(:piece) { double :piece }
  let(:to) { {'x'=>0, 'y'=>1} }
  let(:range_capture) { nil }

  shared_examples 'behavior' do
    it 'moves the piece' do
      move_piece.call
      expect(current_setup).to have_received(:move).with(piece, to)
    end

    context 'king taken' do
      before { game.stub(:complete?).and_return(true) }

      it 'updates action to "complete"' do
        move_piece.call
        expect(game).to have_received(:update_attributes).with(action: 'complete')
      end
    end

    context 'king not taken' do
      before { game.stub(:complete?).and_return(false) }

      it 'updates action_to_id to next_action_to_id' do
        move_piece.call
        expect(game).to have_received(:update_attributes).with(action_to_id: next_action_to_id)
      end
    end
  end

  describe '#call' do
    context 'without range capture' do
      include_examples 'behavior'
    end

    context 'with range capture' do
      let(:range_capture) { {'x'=>0, 'y'=>2} }

      context 'piece captured' do
        let(:opponent_piece) { double :piece }
        before { current_setup.stub(:get).with(range_capture, Piece).and_return(opponent_piece) }
        include_examples 'behavior'

        it 'removes the piece at the range capture' do
          move_piece.call
          expect(current_setup).to have_received(:remove).with(opponent_piece)
        end
      end

      context 'piece not captured' do
        before { current_setup.stub(:get).with(range_capture, Piece).and_return(nil) }
        include_examples 'behavior'
      end
    end
  end
end
