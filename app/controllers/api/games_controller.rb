class Api::GamesController < ApplicationController
  before_filter :authenticate_user!
  before_filter :get_game, except: [:current]
  before_filter :authorize, except: [:current]
  before_filter :scrub_coordinates, only: [:setup_add, :setup_move, :setup_remove, :valid_piece_moves, :piece_move, :piece_move_with_range_capture]
  before_filter :ensure_valid_type, only: [:setup_add, :setup_move, :setup_remove]

  def current
    @game_id = Game.current.for_user(current_user).pluck(:id).first
  end

  def show
  end

  ########################################
  # Setup
  ########################################

  def abort
    @game.destroy
    head :ok
  end

  def setup_add
    type = params[:type].constantize
    attrs = { coordinate: params[:coordinate], type_id: params[:type_id], user_id: current_user.id }

    AddToInitialSetup.new(@game, type, attrs).call
    head :ok
  end

  def setup_move
    from = params[:from]
    to = params[:to]
    type = params[:type].constantize

    MoveInInitialSetup.new(@game, current_user, from, to, type).call
    head :ok
  end

  def setup_remove
    coordinate = params[:coordinate]
    type = params[:type].constantize

    RemoveFromInitialSetup.new(@game, current_user, coordinate, type).call
    head :ok
  end

  def setup_complete
    result, errors = SetupValidator.new(@game, current_user).call

    if result
      @game.setup_complete(current_user)
      render json: { success: true, action: @game.action, action_to_id: @game.action_to_id }
    else
      render json: { success: false, errors: errors }
    end
  end

  ########################################
  # Play
  ########################################

  def opponent_setup
    @opponent_setup = @game.current_setup.for_user_id( @game.opponent_id(current_user.id) )
  end

  def valid_piece_moves
    piece = @game.get_piece(current_user, params[:coordinate])
    moves = piece ? @game.valid_plies_for_user(current_user, piece, piece.coordinate, 'movement') : []
    render json: moves
  end

  def piece_move
    piece = @game.get_piece(current_user, params[:from])
    if piece && PlyValidator.new(@game, piece, params[:to]).call
      if piece.rule.range_capture?
        render json: { success: false, from: params[:from], to: params[:to], range_captures: @game.valid_plies(piece, params[:to], 'range') }
      else
        MovePiece.new(@game, piece, params[:to]).call
        render json: { success: true, from: params[:from], to: params[:to], action: @game.action, action_to_id: @game.action_to_id }
      end
    else
      render json: { success: false }
    end
  end

  def piece_move_with_range_capture
    piece = @game.get_piece(current_user, params[:from])
    if piece && PlyValidator.new(@game, piece, params[:to], params[:range_capture]).call
      MovePiece.new(@game, piece, params[:to], params[:range_capture]).call
      render json: { success: true, from: params[:from], to: params[:to], range_capture: params[:range_capture], action: @game.action, action_to_id: @game.action_to_id }
    else
      render json: { success: false }
    end
  end

  def resign
    @game.resign(current_user)
    render json: { action: @game.action, action_to_id: @game.action_to_id }
  end

  protected

  def get_game
    @game = Game.find(params[:id])
  end

  def authorize
    authorize_action_for @game
  end

  def ensure_valid_type
    head :unprocessable_entity unless ['Piece', 'Terrain'].include?(params[:type])
  end

  def scrub_coordinates
    coordinate_keys = [:coordinate, :to, :from, :range_capture]

    coordinate_keys.each do |coordinate_key|
      coordinate = params[coordinate_key]
      coordinate.each_pair{ |k, v| coordinate[k] = v.to_i } if coordinate
    end
  end

end
