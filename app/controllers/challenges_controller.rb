class ChallengesController < ApplicationController
  before_filter :authenticate_user!
  before_filter :build_challenge, only: [:create]
  before_filter :get_challenge, only: [:destroy, :accept, :decline]
  before_filter :authorize, except: [:index]

  def index
    render json: Challenge.all
  end

  def create
    @challenge.challenger = current_user

    if @challenge.save
      render json: @challenge.to_json
    else
      render json: @challenge.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @challenge.destroy
    head :ok
  end

  def accept
    game = @challenge.accept!(current_user)
    render json: { game_id: game.id }
  end

  def decline
    game = @challenge.decline!(current_user)
    head :ok
  end

  protected

  def build_challenge
    @challenge = Challenge.new(challenge_params)
  end

  def get_challenge
    @challenge = Challenge.find(params[:id])
  end

  def authorize
    authorize_action_for @challenge
  end

  def challenge_params
    params.require(:challenge).permit(:variant_id, :play_as)
  end

end
