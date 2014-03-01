require 'minimal_spec_helper'
require ROOT_DIRECTORY + '/app/game_storage/remove_from_initial_setup.rb'

describe RemoveFromInitialSetup do
  let(:remove_from_initial_setup) { RemoveFromInitialSetup.new(game, object) }
  let(:game) { double :game, initial_setup: initial_setup, board: board }
  let(:initial_setup) { double :initial_setup, remove: nil }
  let(:board) { double :board }

  let(:object) { double :object, coordinate: coordinate, color: 'alabaster' }
  let(:coordinate) { double :coordinate }

  describe '#call' do
    context 'coordinate is invalid' do
      before { board.stub(:coordinate_valid?).with(coordinate).and_return(false) }

      it 'does not remove it from the initial_setup' do
        remove_from_initial_setup.call
        expect(initial_setup).not_to have_received(:remove).with(object)
      end
    end

    context 'coordinate is valid' do
      before { board.stub(:coordinate_valid?).with(coordinate).and_return(true) }

      context 'object in enemy territory' do
        before { board.stub(:territory).with(coordinate).and_return('onyx') }

        it 'does not remove it from the initial_setup' do
          remove_from_initial_setup.call
          expect(initial_setup).not_to have_received(:remove).with(object)
        end
      end

      context 'object in neutral territory' do
        before { board.stub(:territory).with(coordinate).and_return('neutral') }

        it 'does not remove it from the initial_setup' do
          remove_from_initial_setup.call
          expect(initial_setup).not_to have_received(:remove).with(object)
        end
      end

      context 'object in home territory' do
        before { board.stub(:territory).with(coordinate).and_return('alabaster') }

        it 'removes it from the initial_setup' do
          remove_from_initial_setup.call
          expect(initial_setup).to have_received(:remove).with(object)
        end
      end
    end
  end
end
