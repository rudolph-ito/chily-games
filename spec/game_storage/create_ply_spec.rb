require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_storage/create_ply.rb'
require ROOT_DIRECTORY + '/app/game_storage/piece.rb'

describe CreatePly do
  let(:create_ply) { CreatePly.new(game, piece, to, range_capture) }
  let(:game) { double :game, :action= => nil, :action_to_id= => nil, current_setup: current_setup, complete?: true, next_action_to_id: next_action_to_id, plies: plies, save: nil }
  let(:action_to_id) { 1000 }
  let(:next_action_to_id) { 1001 }
  let(:current_setup) { double :current_setup, get: nil, move: nil, remove: nil }
  let(:plies) { double :plies, :add => nil }
  let(:piece) { double :piece, coordinate: from }
  let(:from) { {'x'=>0, 'y'=>0} }

  shared_examples 'game action behavior' do
    it 'appends to plies' do
      create_ply.call
      expect(game.plies).to have_received(:add).with({from: from, to: to, range_capture: range_capture})
    end

    context 'king taken' do
      before { game.stub(:complete?).and_return(true) }

      it 'updates action to "complete"' do
        create_ply.call
        expect(game).to have_received(:action=).with('complete')
      end
    end

    context 'king not taken' do
      before { game.stub(:complete?).and_return(false) }

      it 'updates action_to_id to next_action_to_id' do
        create_ply.call
        expect(game).to have_received(:action_to_id=).with(next_action_to_id)
      end
    end

    it 'saves the game' do
      create_ply.call
      expect(game).to have_received(:save)
    end
  end

  shared_examples 'range capture behavior' do
    context 'piece captured' do
      let(:opponent_piece) { double :piece }
      before { current_setup.stub(:get).with(range_capture, Piece).and_return(opponent_piece) }
      include_examples 'game action behavior'

      it 'removes the piece at the range capture' do
        create_ply.call
        expect(current_setup).to have_received(:remove).with(opponent_piece)
      end
    end

    context 'piece not captured' do
      before { current_setup.stub(:get).with(range_capture, Piece).and_return(nil) }

      it 'does not call remove' do
        create_ply.call
        expect(current_setup).to_not have_received(:remove)
      end
    end
  end

  describe '#call' do
    context 'movement only' do
      let(:to) { {'x'=>0, 'y'=>1} }
      let(:range_capture) { nil }

      it 'moves the piece' do
        create_ply.call
        expect(current_setup).to have_received(:move).with(piece, to)
      end

      include_examples 'game action behavior'
    end

    context 'range_capture only' do
      let(:to) { nil }
      let(:range_capture) { {'x'=>0, 'y'=>1} }

      it 'does not move the piece' do
        create_ply.call
        expect(current_setup).to_not have_received(:move)
      end

      include_examples 'range capture behavior'
    end

    context 'movement and range_capture' do
      let(:to) { {'x'=>0, 'y'=>1} }
      let(:range_capture) { {'x'=>0, 'y'=>2} }

      it 'moves the piece' do
        create_ply.call
        expect(current_setup).to have_received(:move).with(piece, to)
      end

      include_examples 'range capture behavior'
    end
  end
end
