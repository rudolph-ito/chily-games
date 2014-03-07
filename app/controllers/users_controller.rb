class UsersController < ApplicationController
  before_filter :authenticate_user!, except: [:show]
  before_filter :get_user
  before_filter :authorize, except: [:show]

  def show
  end

  def edit
  end

  def update
    if params[:user][:password].blank? && params[:user][:password_confirmation].blank?
      params[:user].delete(:password)
      params[:user].delete(:password_confirmation)
    end
    save "edit"
  end

  def destroy
    @user.destroy
    redirect_to (@user == current_user ? [:new, :user, :session] : :users)
  end

  protected

  def get_user
    @user = User.find(params[:id])
  end

  def authorize
    authorize_action_for @user
  end

  def user_params
    params.require(:user).permit(
      :username, :email,
      :password, :password_confirmation
    )
  end

  def save render_on_failure
    if @user.update_attributes(user_params)
      redirect_to @user
    else
      render render_on_failure
    end
  end
end
