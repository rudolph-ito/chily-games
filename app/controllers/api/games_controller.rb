class Api::GamesController < ApplicationController
  before_filter :authenticate_user!
  before_filter :get_game, except: [:current]
  before_filter :authorize, except: [:current]
  authority_actions setup_add_piece: 'setup', setup_move_piece: 'setup', setup_remove_piece: 'setup', setup_complete: 'setup', valid_piece_moves: 'read', piece_move: 'move'

  def current
    @game_id = Game.for_user(current_user).pluck(:id).first
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

  def setup_add_piece
    @game.setup_add_piece(current_user, params[:piece_type_id], params[:coordinate])
    head :ok
  end

  def setup_move_piece
    @game.setup_move_piece(current_user, params[:from], params[:to])
    head :ok
  end

  def setup_remove_piece
    @game.setup_remove_piece(current_user, params[:coordinate])
    head :ok
  end

  def setup_complete
    errors = @game.setup_errors(current_user)
    if errors.empty?
      @game.setup_complete(current_user)
      render json: { success: true, action: @game.action, action_to_id: @game.action_to_id }
    else
      render json: { success: false, errors: errors }
    end
  end

  ########################################
  # Play
  ########################################

  def valid_piece_moves
    piece = @game.pieces.for_coordinate(params[:coordinate]).first
    moves = piece ? @game.valid_plies(piece).map{|x| x['to']} : []
    render json: moves
  end

  def piece_move
    scrub_coordinate(params[:from], params[:to])

    if @game.ply_valid?(params[:from], params[:to])
      @game.move_piece(params[:from], params[:to])
      render json: { success: true, from: params[:from], to: params[:to] }
    else
      render json: { success: false }
    end
  end

  def resign
    @game.destroy
    head :ok
  end

  protected

  def get_game
    @game = Game.find(params[:id])
  end

  def authorize
    authorize_action_for @game
  end

  def scrub_coordinate(*coords)
    coords.each do |coord|
      coord.each_pair{ |k, v| coord[k] = v.to_i }
    end
  end

end
