import styled from 'styled-components'
import colors from './colors'

export const ButtonPoster = styled.button`
  /* width: 225px;
  height: 52px; */
  font-family: 'Roboto';
  border-radius: 9999px;
  background-color: ${colors.primary};
  color: white;
  font-weight: 700;
  font-size: 19px;
  border: none;
  cursor: pointer;

  :hover {
    background-color: ${colors.hoverPrimary};
    /* color: ${colors.secondary}; */
  }
`
